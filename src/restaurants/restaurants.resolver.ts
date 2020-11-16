import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRestaurnatDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/updat-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';

@Resolver(() => Restaurant)
export class RestaurnatResolver {
  constructor(private readonly restaurantService: RestaurantService) {}
  @Query(() => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }
  @Mutation(() => Boolean)
  async createRestaurant(
    @Args('input') createRestaurantInput: CreateRestaurnatDto,
  ): Promise<boolean> {
    console.log(createRestaurantInput);
    try {
      await this.restaurantService.createRestaurant(createRestaurantInput);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  @Mutation(() => Boolean)
  async updateRestaurant(
    @Args('input') updateRestaurantInput: UpdateRestaurantDto,
  ): Promise<boolean> {
    try {
      await this.restaurantService.updateRestaurant(updateRestaurantInput);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
