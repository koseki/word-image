# word-image

Generate an image from a single word. To generate pictures for the dictionary.

```
[word] --> GPT --> [image prompt] --> DALL-E, Stable Difusion --> [image]
```

## Usage

```
$ npm install
$ npm build
$ mkdir data

$ export OPENAI_API_KEY=...
$ export DIFFUSIOn_API_KEY=...

$ node ./dest/index.js [word]
```

## Options

```
--file [word list file]
--image {stable-diffusion,dall-e,s,d}
--lang {en,ja}
--debug
--help
```

## Examples

### Word: clavicle

```
$ node ./dest/index.js clavicle
```

`data/clavicle.png`<br>
![clavicle](./docs/example/clavicle.png)

`data/clavicle.txt`
```
gpt-3.5-turbo
dall-e
The doctor examined the x-ray and found that the patient had fractured their clavicle in a skiing accident.
```

### Word: megalomaniac

```
$ node ./dest/index.js megalomaniac
```

`data/megalomaniac.png`<br>
![megalomaniac](./docs/example/megalomaniac.png)

`data/megalomaniac.txt`
```
gpt-3.5-turbo
dall-e
The megalomaniac CEO insisted on having his own personal elevator installed in the company's headquarters.
```
