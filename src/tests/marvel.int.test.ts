import MarvelRoute from '@routes/marvel.route';
import App from '@/app';
import request from 'supertest';

describe('Test Marvel Character', () => {
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
