# amokify
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
