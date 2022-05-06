#!/bin/bash
cd ../dist && 
zip -9r plugin.zip index.html build.js style.css
mv plugin.zip ../sh
cd ../sh
