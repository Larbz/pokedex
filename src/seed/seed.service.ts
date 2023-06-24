import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosInstance } from 'axios';
import { Model } from 'mongoose';
import { AxiosAdapter } from './../common/adapters/axios.adapter';
import { Pokemon } from './../pokemon/entities/pokemon.entity';
import { PokeResponse } from './interfaces/poke-response.interface';

@Injectable()
export class SeedService {
  // private readonly axios: AxiosInstance = axios;
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,

    private readonly http: AxiosAdapter,
  ) {}
  async executeSeed() {
    const data = await this.http.get<PokeResponse>(
      'https://pokeapi.co/api/v2/pokemon?limit=100600',
    );
    // const insertPromisesArray = [];
    const pokemonsToInsert: { name: string; no: number }[] = [];
    data.results.forEach(async ({ name, url }) => {
      const segments = url.split('/');
      const no: number = parseInt(segments[segments.length - 2]);
      // const pokemon = await this.pokemonModel.create({ name, no });
      pokemonsToInsert.push({ name, no });
      // insertPromisesArray.push({ name, no });
    });
    // await Promise.all(insertPromisesArray);
    this.pokemonModel.insertMany(pokemonsToInsert);
    return 'Seed executed';
  }
}
