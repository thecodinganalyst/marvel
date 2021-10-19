import { CharacterDataWrapper, CharacterSummary, MarvelAuth } from '@interfaces/marvel.interface';
import 'dotenv/config';
import md5 from 'md5';
import axios from 'axios';
import { HttpException } from '@exceptions/HttpException';
import NodeCache from 'node-cache';
import config from 'config';
import { logger} from '@utils/logger';

class MarvelService {
  public marvelBaseUrl: string = config.get('marvelBaseUrl');
  public characterEndpoint: string = config.get('characterEndpoint');
  public characterListEndpoint: string = config.get('characterListEndpoint');
  private simpleGetStrategy = new SimpleGetStrategy();
  private cacheGetStrategy = new CacheGetStrategy();
  public marvelApi = new MarvelApi();

  private characterStore = new NodeCache({ stdTTL: 600 });
  private characterList: String[];

  public async getCharacterIdList(): Promise<String[]> {
    logger.info(`MarvelService: getCharacterIdList`);
    const url = this.marvelBaseUrl + this.characterListEndpoint;
    const param = { offset: 0, limit: 100 };

    let wrapper = await this.marvelApi.GetApi(url, this.cacheGetStrategy, new Map(Object.entries(param)));
    if (wrapper.code == 304) return this.characterList;
    if (wrapper.code != 200) throw new HttpException(wrapper.code, wrapper.status);
    if (wrapper.code == 200) {
      const total = wrapper.data.total;
      this.characterList = wrapper.data.results.map(val => val.id.toString());
      while (this.characterList.length < total) {
        param.offset += param.limit;
        wrapper = await this.marvelApi.GetApi(url, this.cacheGetStrategy, new Map(Object.entries(param)));
        this.characterList.push(...wrapper.data.results.map(val => val.id.toString()));
      }
      return this.characterList;
    } else {
      return Promise.reject(wrapper.status);
    }
  }

  public async getCharacter(characterId: number): Promise<CharacterSummary> {
    logger.error(`MarvelService: getCharacter: ` + characterId);
    const url = this.marvelBaseUrl + this.characterEndpoint + characterId;
    let characterSummary = this.characterStore.get(characterId) as CharacterSummary;
    if (characterSummary) {
      return characterSummary;
    }
    const wrapper = await this.marvelApi.GetApi(url, this.simpleGetStrategy, new Map<string, string>());
    if (wrapper.code != 200) return Promise.reject(new HttpException(wrapper.code, wrapper.status));
    if (wrapper.data.count >= 1) {
      const character = wrapper.data.results[0];
      characterSummary = { Id: character.id, Name: character.name, Description: character.description };
      this.characterStore.set(characterId, characterSummary);
      return Promise.resolve(characterSummary);
    } else {
      return Promise.reject(new HttpException(404, 'no character found'));
    }
  }
}

class MarvelApi {
  public async GetApi(url: string, getStrategy: GetStrategy, params: any): Promise<CharacterDataWrapper> {
    logger.info(`MarvelApi: GetApi`);
    return await getStrategy.get(url, this.combineParams(params));
  }
  public combineParams(params: any): any {
    const auth = this.getAuthenticationParams();
    const newParam = Object.assign({}, params);
    newParam.ts = auth.ts;
    newParam.apikey = auth.apikey;
    newParam.hash = auth.hash;
    return newParam;
  }

  public getAuthenticationParams(): MarvelAuth {
    const ts = Date.now().toString(10);
    const apiKey = process.env.MARVEL_PUBLIC_KEY;
    const secret = ts.concat(process.env.MARVEL_PRIVATE_KEY).concat(process.env.MARVEL_PUBLIC_KEY);
    const hash = md5(secret);
    return { ts: ts, apikey: apiKey, hash: hash };
  }
}

interface GetStrategy {
  get(url: string, params: any): Promise<CharacterDataWrapper>;
}

class SimpleGetStrategy implements GetStrategy {
  async get(url: string, params: any): Promise<CharacterDataWrapper> {
    logger.info(`SimpleGetStrategy: get`);
    logger.info(`SimpleGetStrategy: get: ` + url + `: ` + JSON.stringify(params));
    const response = await axios.get(url, {
      headers: {
        Accept: '*/*',
      },
      params: params,
    });
    return response.data as CharacterDataWrapper;
  }
}

class CacheGetStrategy implements GetStrategy {
  private etagList = new Map<string, string>();
  async get(url: string, params: any): Promise<CharacterDataWrapper> {
    logger.info(`CacheGetStrategy: get`);
    const etagKey = this.genEtagKeyForMultiPageUrl(url, params);
    const etag: string = this.etagList.get(etagKey) ? this.etagList.get(etagKey) : '';
    logger.info(`CacheGetStrategy: get: ` + url + `: ` + etag + `: ` + JSON.stringify(params));
    const response = await axios.get(url, {
      headers: {
        Accept: '*/*',
        'If-None-Match': etag,
      },
      params: params,
    });
    const wrapper = response.data as CharacterDataWrapper;
    if (wrapper.etag) {
      this.etagList.set(etagKey, wrapper.etag);
    }
    return wrapper;
  }

  genEtagKeyForMultiPageUrl(url: string, params: any): string {
    const copy = Object.assign({}, params);
    if (copy.hasOwnProperty('ts')) delete copy.ts;
    if (copy.hasOwnProperty('apikey')) delete copy.apikey;
    if (copy.hasOwnProperty('hash')) delete copy.hash;
    return (
      url +
      '?' +
      Object.keys(copy)
        .map(it => it + '=' + copy[it])
        .join('&')
    );
  }
}

export { MarvelService, MarvelApi, SimpleGetStrategy, CacheGetStrategy };
