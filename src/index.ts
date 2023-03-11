import { Configuration, OpenAIApi } from "openai";
// import { argv } from "process";
import axios from 'axios';
import yargs from 'yargs';
import fs from 'fs-extra';
import path from "path";

class Main {
  async run(lang: string, word: string) {
    const template = await fs.readFile(path.join(__dirname, `../prompts/${lang}.txt`), "utf-8");
    let prompt = template.replace(/\{word\}/g, word);

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: prompt
      }]
    });
    const message = completion.data.choices[0].message?.content
    if (!message) {
      console.log("Can't generate prompt");
      return;
    }
    console.log(message);

    const wordEncoded = encodeURIComponent(word);
    const sentenceFile = await this.getOutputFile(wordEncoded, 'txt');
    await fs.writeFile(sentenceFile, message);

    console.log("Generating image...");

    const response = await openai.createImage({
      prompt: message,
      n: 1,
      size: "512x512"
    });
    const imageURL = response.data.data[0].url;
    console.log(imageURL);
    if (!imageURL) {
      console.log("Can't get image URL");
      return;
    }
    const res = await axios.get(imageURL, {responseType: 'arraybuffer'});
    const imageFile = await this.getOutputFile(wordEncoded, 'png');
    fs.writeFileSync(imageFile, Buffer.from(res.data), 'binary');
  }

  async getOutputFile(word: string, ext: string) {
    let sentenceFile = path.join(__dirname, `../data/${word}.${ext}`);
    let count = 0;
    while (await fs.pathExists(sentenceFile)) {
      count++;
      sentenceFile = path.join(__dirname, `../data/${word}-${count}.${ext}`);
    }
    return sentenceFile;
  }
}

(async () => {
  const argv: any = yargs
    .command("* [word]", "")
    .option('lang', {
      demandOption: true,
      default: 'en',
      choices: ['en', 'ja'],
      describe: 'language that select a prompt template',
      type: 'string'
    })
    .help()
    .argv
  const main = new Main();
  await main.run(argv.lang, argv.word);
})();
