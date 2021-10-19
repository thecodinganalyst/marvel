import MarvelRoute from '@routes/marvel.route';
import App from '@/app';
import request from 'supertest';
import axios from 'axios';
import config from 'config';
import { MarvelApi } from '@services/marvel.service';
import { CharacterDataWrapper } from '@interfaces/marvel.interface';

const marvelBaseUrl: string = config.get('marvelBaseUrl');
const characterEndpoint: string = config.get('characterEndpoint');
const characterListEndpoint: string = config.get('characterListEndpoint');

const marvelApi = new MarvelApi();

describe('Test Marvel Character', () => {
  describe('Test Marvel API', () => {
    jest.setTimeout(10000);
    it('should return iron man', async () => {
      const url = marvelBaseUrl + characterEndpoint + '1009368';
      const param = marvelApi.getAuthenticationParams();
      const response = await axios.get(url, {
        headers: {
          Accept: '*/*',
        },
        params: param,
      });
      const wrapper = response.data as CharacterDataWrapper;
      expect(wrapper.code).toBe(200);
      expect(wrapper.data.count).toBe(1);
      expect(wrapper.data.results[0].name).toBe('Iron Man');
    });

    it('should return a list of characters', async () => {
      const url = marvelBaseUrl + characterListEndpoint;
      const param = marvelApi.combineParams({ offset: 0, limit: 100 });
      const response = await axios.get(url, {
        headers: {
          Accept: '*/*',
        },
        params: param,
      });
      const wrapper = response.data as CharacterDataWrapper;
      expect(wrapper.code).toBe(200);
      expect(wrapper.data.count).toBe(100);
      expect(wrapper.data.results[0].name).toBeTruthy();
    });

    it('should return 304', async () => {
      const url = marvelBaseUrl + characterListEndpoint;
      const param = marvelApi.combineParams({ offset: 0, limit: 100 });
      const response = await axios.get(url, {
        headers: {
          Accept: '*/*',
          'If-None-Match': '',
        },
        params: param,
      });
      const wrapper = response.data as CharacterDataWrapper;
      expect(wrapper.code).toBe(200);
      expect(wrapper.etag).toBeTruthy();
      const etag = wrapper.etag;

      await axios
        .get(url, {
          headers: {
            Accept: '*/*',
            'If-None-Match': etag,
          },
          params: param,
        })
        .catch(e => expect(e.response.status).toBe(304));
    });
  });

  describe('[GET] /characters/:id', () => {
    it('should get Iron Man', () => {
      const characterId = 1009368;
      const marvelRoute = new MarvelRoute();
      const app = new App([marvelRoute]);

      return request(app.getServer())
        .get(`${marvelRoute.path}/${characterId}`)
        .expect(200)
        .expect(res => expect(res.body.Name).toBe('Iron Man'));
    });

    it('should get 404', () => {
      const characterId = 1;
      const marvelRoute = new MarvelRoute();
      const app = new App([marvelRoute]);

      return request(app.getServer()).get(`${marvelRoute.path}/${characterId}`).expect(404);
    });
  });
});
