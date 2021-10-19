import { MarvelService } from '@services/marvel.service';
import { NextFunction, Request, Response } from 'express';
import { CharacterSummary } from '@interfaces/marvel.interface';
import { logger, stream } from '@utils/logger';

class MarvelController {
  public marvelService = new MarvelService();

  public getCharacterById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info(`MarvelController: getCharacterById`);
    try {
      const characterId = Number(req.params.id);
      logger.info(`MarvelController: getCharacterById: ` + characterId);
      const character: CharacterSummary = await this.marvelService.getCharacter(characterId);

      res.status(200).json(character);
    } catch (error) {
      logger.error(`MarvelController: ` + error.response.status + `: ` + error.response.statusText);
      res.status(error.response.status).json(error.response.statusText);
    }
  };

  public getCharacterIdList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info(`MarvelController: getCharacterIdList`);
    try {
      const characterIdList: String[] = await this.marvelService.getCharacterIdList();

      res.status(200).json(characterIdList);
    } catch (error) {
      logger.error(`MarvelController: ` + error.response.status + `: ` + error.response.statusText);
      res.status(error.response.status).json(error.response.statusText);
    }
  };
}

export default MarvelController;
