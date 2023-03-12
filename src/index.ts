import { Configuration, OpenAIApi } from "openai";
// import { argv } from "process";
import axios from 'axios';
import yargs from 'yargs';
import fs from 'fs-extra';
import path from "path";

const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));
class Main {

  private openaiConfig: Configuration | undefined;

  async run(lang: string, file: string, word: string, debug: boolean = false) {
    if (file && word) {
      console.log("Can't specify both file and word");
      return;
    }
    if (!file && !word) {
      console.log("Specify file or word");
      return;
    }
    if (!process.env.OPENAI_API_KEY) {
      console.log("OPENAI_API_KEY is not set");
      return;
    }

    this.openaiConfig = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (file) {
      const wordlist = await fs.readFile(file, "utf-8");
      const words = wordlist.split(/\s+/).map((w) => w.trim()).filter((w) => w.length > 0);
      for (const word of words) {
        await this.generateImage(word, lang, debug);
        await sleep(500);
      }
    } else {
      await this.generateImage(word, lang, debug);
    }
  }

  async generateImage(word: string, lang: string, debug: boolean = false) {
    console.log(`Word: ${word}`);
    const template = await fs.readFile(path.join(__dirname, `../prompts/${lang}.txt`), "utf-8");
    let prompt = template.replace(/\{word\}/g, word);

    const openai = new OpenAIApi(this.openaiConfig);

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
    if (!imageURL) {
      console.log("Can't get image URL");
      console.log(response.data);
      return;
    }
    if (debug) {
      console.log(imageURL);
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
    .command("* [word]", "Generate image from a single word")
    .boolean(['debug'])
    .describe('debug', 'show debug information')
    .option('lang', {
      demandOption: true,
      default: 'en',
      choices: ['en', 'ja'],
      describe: 'language that select a prompt template',
      type: 'string'
    })
    .option('f', {
      alias: 'file',
      describe: 'words file',
      type: 'string'
    })
    .help()
    .argv
  const main = new Main();
  await main.run(argv.lang, argv.file, argv.word, argv.debug);
})();
