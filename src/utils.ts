import fs from "fs-extra";
import path from "path";

export async function getOutputFile(word: string, ext: string) {
  const wordEncoded = encodeURIComponent(word);

  let sentenceFile = path.join(__dirname, `../data/${wordEncoded}.${ext}`);
  let count = 0;
  while (await fs.pathExists(sentenceFile)) {
    count++;
    sentenceFile = path.join(__dirname, `../data/${wordEncoded}-${count}.${ext}`);
  }
  return sentenceFile;
}
