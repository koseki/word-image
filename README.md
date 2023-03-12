# word-image

Generate an image from a single word. To generate pictures for the dictionary.


## Usage

```
$ npm install
$ npm build
$ mkdir data
$ node ./dest/index.js --image dall-e [word]
```

## Options

```
--file [word list file]
--image {s,stable-diffusion,d,dall-e}
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
