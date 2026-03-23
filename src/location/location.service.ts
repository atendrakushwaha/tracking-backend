import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema';

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(Location.name)
    private locationModel: Model<LocationDocument>,
  ) {}

  // 🔥 UPDATE USER LOCATION
  async updateLocation(userId: string, latitude: number, longitude: number) {
    // console.log(`Updating location for user ${userId}: (${latitude}, ${longitude})`);
    return this.locationModel.findOneAndUpdate(
      { userId },
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
      { upsert: true, new: true },
    );
  }

  // 🔥 FIND NEARBY USERS (2-3 KM)
  async findNearbyUsers(userId: string, latitude: number, longitude: number) {
    return this.locationModel.find({
      userId: { $ne: userId }, // exclude self
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: 3000, // 🔥 3 KM (in meters)
        },
      },
    }).populate('userId', 'name email');
  }
}