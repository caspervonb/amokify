# amokify

[![Join the chat at https://gitter.im/caspervonb/amokify](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/caspervonb/amokify?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
A browserify plugin which complements [amok](http://amokjs.com) with
post-patch execution of top level module expressions.

Note that this is very experimental.

## INSTALL
```sh
npm install caspervonb/amokify [--save]
```

## USAGE
With amok

```
$ amok entry.js --browser chrome --compiler watchify -- --plugin amokify --full-paths

```

With watchify

```
$ watchify entry.js --outfile build/entry.js --plugin amokify
$ amok build/entry.js --browser chrome
```
