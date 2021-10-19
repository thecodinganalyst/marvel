# Marvel Characters API

## Dependencies

This project runs on NodeJS, download and install NodeJS & NPM from [https://nodejs.org/en/download/](https://nodejs.org/en/download/).

## Configuration

Create a file named `.env` in the root of this project with the following
```
PORT=8080
MARVEL_PRIVATE_KEY=<MARVEL_PRIVATE_KEY>
MARVEL_PUBLIC_KEY=<MARVEL_PUBLIC_KEY>
```
Replace the <MARVEL_PRIVATE_KEY> and <MARVEL_PUBLIC_KEY> with the actual key pairs from developer.marvel.com.

## Installation

Run `npm run build` in a terminal window, in the root folder of this project.

## Running the project

Run `npm run start` in a terminal window, in the root folder of this project.
Open a browser window, and navigate to `http://localhost:8080/api-docs` to view the documentation for the APIs.

Alternatively, navigate to `http://localhost:8080/characters` or `http://localhost:8080/character/1009368` to try the APIs directly.

## Testing the project

Run `npm run test`.

## Caching of the results

**For the API on getting of single character - `http://localhost:8080/character/:id`: **

During the first time the specific character is called, it will be saved in a cache. For this project, we are using (node-cache)[https://www.npmjs.com/package/node-cache].
The cache will have a time-to-live (TTL) of 10 mins. During this time, any repeated calling of the same character will be retrieved from this cache. After which, it will get the data from the marvel portal again.

**For the API on getting the list of all characters - http://localhost:8080/characters`: **

We are using the `If-None-Match` header method provided by Marvel API. After the first time the api is called, the etag received from the API will be saved.
The list of characters is also saved in the memory. Then subsequent calls to the api will pass in the etag in the `If-None-Match` header, and marvel api will return status code of 304 if there are no changes.
If this 304 status is retrieved, the program will just return the saved list of characters in the memory. The program will assume that subsequent pages will be the same also, and will not continue to call the character list from subsequent pages.
Until the actual data changes at developer.marvel.com, resulting in 200 returned instead of 304, will the program replace the saved character list with the new data from the marvel server.
Node-Cache is not used here because the number of calls to this api is numerous, so we want to cache as long as possible, without a fixed TTL. 1 call to marvel server to check the status if data has change, will suffice.



