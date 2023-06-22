import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(
          `Pokemon already exists in db ${JSON.stringify(error.keyValue)}`,
        );
      }
      throw new InternalServerErrorException();
    }
  }

  async findAll() {
    const pokemons = await this.pokemonModel.find({});
    return pokemons;
  }

  async findOne(term: string) {
    let pokemon: Pokemon;
    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    //MONGOID
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }

    //NAME
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({
        name: term.toLowerCase().trim(),
      });
    }

    if (!pokemon) {
      throw new NotFoundException();
    }

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);
    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }
    try {
      await pokemon.updateOne(updatePokemonDto);
    } catch (error) {
      this.handleExceptions(error);
    }
    return { ...pokemon.toJSON(), ...updatePokemonDto };
  }

  async remove(id: string) {
    // const result = this.pokemonModel.findByIdAndDelete(term);
    const { deletedCount, acknowledged } = await this.pokemonModel.deleteOne({
      _id: id,
    });
    if (!deletedCount) {
      throw new BadRequestException(`Not found with the id ${id}`);
    }
    return;
    // const pokemon = await this.findOne(term);
    // try {
    //   await pokemon.deleteOne();
    // } catch (error) {
    //   this.handleExceptions(error);
    // }
    // return {
    //   res: true,
    //   message: 'Deleted',
    // };
  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException('Duplicated key');
    }
    throw new InternalServerErrorException();
  }
}
