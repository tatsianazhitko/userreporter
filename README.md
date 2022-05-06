# bitrix24-time-report

> Bitrix24 application \"Responsible Report\"

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload
npm run dev

# build for production with minification
npm run build
```

For detailed explanation on how things work, consult the [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Prepare

1. sudo apt install nginx
2. sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/cert.key -out /etc/nginx/cert.crt
3. sudo touch /etc/nginx/sites-available/b24-jkkezi_bitrix24_ru
4. sudo nano /etc/nginx/sites-available/b24-jkkezi_bitrix24_ru
4.1 paste nginx-site.conf
5. sudo service nginx restart
6. sudo nano /etc/hosts
6.1. add lines:
127.0.0.1       b24-jkkezi.bitrix24.ru
127.0.0.1       apps-b9574557.bitrix24-cdn.com

# Work
1. sudo ./sync.sh
2. close chrome
3. ./unsecure_chrome.sh
4. open url https://b24-jkkezi.bitrix24.ru/marketplace/app/7/
