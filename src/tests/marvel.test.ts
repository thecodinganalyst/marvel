import { CacheGetStrategy, MarvelApi, MarvelService, SimpleGetStrategy } from '@services/marvel.service';
import axios from 'axios';
import { HttpException } from '@exceptions/HttpException';
import { Character, CharacterDataContainer, CharacterDataWrapper, CharacterSummary } from '@interfaces/marvel.interface';

jest.mock('axios');
const mockCharacter = { id: 1, name: 'name', description: 'description' } as Character;
const mockCharacterSummary = { Id: 1, Name: 'name', Description: 'description' } as CharacterSummary;
const sampleCharacterDataContainer = {
  offset: 0,
  limit: 1,
  total: 1,
  count: 1,
  results: [mockCharacter],
} as CharacterDataContainer;
const sampleWrapper = {
  code: 200,
  status: 'OK',
  copyright: 'copyright',
  attributionText: 'attributionText',
  attributionHTML: 'attributionHTML',
  data: sampleCharacterDataContainer,
  etag: '123',
} as CharacterDataWrapper;
const sampleWrapper404 = {
  code: 404,
  status: 'not found',
  copyright: 'copyright',
  attributionText: 'attributionText',
  attributionHTML: 'attributionHTML',
  data: {},
  etag: '123',
} as CharacterDataWrapper;

afterAll(async () => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
});

describe('MarvelService Test', () => {
  describe('MarvelService', () => {
    const marvelService = new MarvelService();
    it('GetCharacter', () => {
      const spy = jest.spyOn(marvelService.marvelApi, 'GetApi');
      expect(marvelService.getCharacter(1)).rejects.toBeTruthy();
      expect(spy).toHaveBeenCalled();
    });

    it('GetCharacter not 200', async () => {
      const spy = jest.spyOn(marvelService.marvelApi, 'GetApi');
      spy.mockReturnValue(Promise.resolve(sampleWrapper404));
      await expect(marvelService.getCharacter(1)).rejects.toBeTruthy();
    });

    it('GetCharacter found from api', async () => {
      const spy = jest.spyOn(marvelService.marvelApi, 'GetApi');
      spy.mockReturnValue(Promise.resolve(sampleWrapper));
      await expect(marvelService.getCharacter(1)).resolves.toStrictEqual(mockCharacterSummary);
    });

    it('GetCharacter found from cache', async () => {
      const spy = jest.spyOn(marvelService.marvelApi, 'GetApi');
      spy.mockReturnValue(Promise.resolve(sampleWrapper));
      await expect(marvelService.getCharacter(1)).resolves.toStrictEqual(mockCharacterSummary);
      await marvelService.getCharacter(1);
      spy.mockClear();
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  describe('MarvelApi', () => {
    const marvelApi = new MarvelApi();

    it('get can use SimpleGetStrategy', () => {
      const simpleGetStrategy = new SimpleGetStrategy();
      const spy = jest.spyOn(simpleGetStrategy, 'get');
      axios.get = jest.fn().mockReturnValue({ data: sampleWrapper });
      try {
        marvelApi.GetApi('url', simpleGetStrategy, { a: 1, b: 2 });
      } finally {
        expect(spy).toHaveBeenCalled();
      }
    });

    it('get can use CacheGetStrategy', () => {
      const cacheGetStrategy = new CacheGetStrategy();
      const spy = jest.spyOn(cacheGetStrategy, 'get');
      axios.get = jest.fn().mockReturnValue({ data: sampleWrapper });
      try {
        marvelApi.GetApi('url', cacheGetStrategy, { a: 1, b: 2 });
      } finally {
        expect(spy).toHaveBeenCalled();
      }
    });

    it('combineParams combine correctly', () => {
      const result = marvelApi.combineParams({ a: 1, b: 2 });
      expect(result).toHaveProperty('a');
      expect(result.a).toBe(1);
      expect(result).toHaveProperty('b');
      expect(result.b).toBe(2);
      expect(result).toHaveProperty('ts');
      expect(result).toHaveProperty('apikey');
      expect(result).toHaveProperty('hash');
    });

    it('getAuthenticationParams should return ts, apikey and hash', () => {
      const params = marvelApi.getAuthenticationParams();
      expect(params).toBeDefined();
      expect(params).toHaveProperty('ts');
      expect(params).toHaveProperty('apikey');
      expect(params).toHaveProperty('hash');
    });
  });

  describe('SimpleGetStrategy', () => {
    it('should get correctly', () => {
      const spy = jest.spyOn(axios, 'get');
      const simpleGetStrategy = new SimpleGetStrategy();
      try {
        simpleGetStrategy.get('url', { param: '1' });
      } finally {
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith('url', {
          headers: {
            Accept: '*/*',
          },
          params: { param: '1' },
        });
      }
    });
  });

  describe('CacheGetStrategy', () => {
    it('should generate the etagKey correctly', () => {
      const cacheGetStrategy = new CacheGetStrategy();
      const key = cacheGetStrategy.genEtagKeyForMultiPageUrl('url', { foo: 'bar', ts: 'ts1', apikey: 'apikey', hash: 'hash' });
      expect(key).toBe('url?foo=bar');
    });
    it('should resolve when 304 is received', async () => {
      jest.mock('axios');
      axios.get = jest.fn().mockRejectedValue({ response: { status: 304 } });
      const cacheGetStrategy = new CacheGetStrategy();
      const res = await cacheGetStrategy.get('url', { param: '1' });
      expect(res.status).toBe(304);
    });
    it('should get call with the etag on the 2nd attempt', async () => {
      jest.mock('axios');
      axios.get = jest.fn().mockReturnValue({ data: sampleWrapper });
      const cacheGetStrategy = new CacheGetStrategy();
      await cacheGetStrategy.get('url', { param: '1' });
      expect(axios.get).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalledWith('url', {
        headers: {
          Accept: '*/*',
          'If-None-Match': '',
        },
        params: { param: '1' },
      });
      await cacheGetStrategy.get('url', { param: '1' });
      expect(axios.get).toHaveBeenCalledWith('url', {
        headers: {
          Accept: '*/*',
          'If-None-Match': '123',
        },
        params: { param: '1' },
      });
    });
  });
});
