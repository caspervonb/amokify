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
$ amok --hot --browser chrome --compiler watchify entry.js -- --plugin amokify --full-paths

```

With watchify

```
$ watchify entry.js --outfile build/entry.js --plugin amokify --full-paths
$ amok --hot --browser chrome build/entry.js
```
