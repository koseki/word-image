import { Configuration, OpenAIApi } from "openai";
// import { argv } from "process";
import axios from 'axios';
import yargs from 'yargs';
import fs from 'fs-extra';
import path from "path";

import { generateStableDiffusionImage } from "./diffusion";
import { getOutputFile } from "./utils";

const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));
class Main {

  private lang: string = "en";
  private debug: boolean = false;
  private imageGenerator: string = "dall-e";

  private openaiConfig: Configuration | undefined;

  async run(lang: string, file: string, word: string, imageGenerator: string, debug: boolean = false) {
    this.lang = lang;
    this.debug = debug;

    const imageGeneratorShort: { [key:string]: string } = {
      s: 'stable-diffusion',
      d: 'dall-e'
    }
    if (imageGenerator in imageGeneratorShort) {
      this.imageGenerator = imageGeneratorShort[imageGenerator];
    } else {
      this.imageGenerator = imageGenerator;
    }

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
      for (const wordItem of words) {
        try {
          await this.generateImage(wordItem);
        } catch (e) {
          console.log(e);
        }
        await sleep(500);
      }
    } else {
      await this.generateImage(word);
    }
  }

  async generateImage(word: string) {
    console.log(`Word: ${word}`);
    console.log('Generating an image prompt using GPT3.5 turbo...')
    const template = await fs.readFile(path.join(__dirname, `../prompts/${this.lang}.txt`), "utf-8");
    let prompt = template.replace(/\{word\}/g, word);

    const openai = new OpenAIApi(this.openaiConfig);

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
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

    if (this.imageGenerator == 'dall-e') {
      console.log("Generating image using DALL-E...");
      await this.generateDallEImage(openai, word, message);
    } else if (this.imageGenerator == 'stable-diffusion') {
      console.log("Generating image using Stable Diffusion...");
      await generateStableDiffusionImage(word, message, this.debug);
    }

    let promptText = `gpt-3.5-turbo\n${this.imageGenerator}\n${message}\n`;
    const sentenceFile = await getOutputFile(word, 'txt');
    await fs.writeFile(sentenceFile, promptText);
  }

  async generateDallEImage(openai: OpenAIApi, word: string, message: string) {

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
    if (this.debug) {
      console.log(imageURL);
    }
    const res = await axios.get(imageURL, {responseType: 'arraybuffer'});
    const imageFile = await getOutputFile(word, 'png');
    fs.writeFileSync(imageFile, Buffer.from(res.data), 'binary');
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
    .option('image', {
      demandOption: true,
      default: 'dall-e',
      choices: ['stable-diffusion', 'dall-e', 's', 'd'],
      describe: 'image generator',
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
  await main.run(argv.lang, argv.file, argv.word, argv.image, argv.debug);
})();
