import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
// import { Cron, Interval, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { LessThan, Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>, // private schedulerRegistry: SchedulerRegistry,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      console.log(owner, { transactionId, restaurantId });
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'You are not allowed to do this',
        };
      }

      await this.payments.save(
        this.payments.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );

      restaurant.isPromoted = true;
      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.promotedUntil = date;
      this.restaurants.save(restaurant);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create payment',
      };
    }
  }

  async getPayments(user: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payments.find({ user: user });
      if (!payments) {
        return {
          ok: false,
          error: 'Payments not found',
        };
      }
      return {
        ok: true,
        payments,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not get payment',
      };
    }
  }

  @Interval(2000)
  async checkPromotedRestaurants() {
    try {
      const restaurants = await this.restaurants.find({
        isPromoted: true,
        promotedUntil: LessThan(new Date()),
      });
      console.log(restaurants);
      restaurants.forEach(async restaurant => {
        restaurant.isPromoted = false;
        restaurant.promotedUntil = null;
        await this.restaurants.save(restaurant);
      });
    } catch {}
  }

  //   @Cron('30 * * * * *', { name: 'myJob' })
  //   checkForPayments() {
  //     console.log('Checking for payments...(cron)');
  //     const job = this.schedulerRegistry.getCronJob('myJob');
  //     console.log(job);
  //     job.stop();
  //   }

  //   @Interval(5000)
  //   checkForPaymentsI() {
  //     console.log('checking for payments... (interval)');
  //   }

  //   @Timeout(30000)
  //   afterStarts() {
  //     console.log('Congrats!');
  //   }
}
