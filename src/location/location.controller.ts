import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // 🔥 UPDATE LOCATION
  @Post('update')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('Authentication')
  @ApiOperation({ summary: 'Update user location' })
  updateLocation(@Req() req, @Body() dto: UpdateLocationDto) {
    // console.log('Received location update:', req.user._id);
    return this.locationService.updateLocation(
      req.user._id,
      dto.latitude,
      dto.longitude,
    );
  }

  // 🔥 GET NEARBY USERS
  @Get('nearby')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('Authentication')
  @ApiOperation({ summary: 'Get nearby users (within 3km)' })
  getNearbyUsers(
    @Req() req,
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ) {
    return this.locationService.findNearbyUsers(
      req.user._id,
      Number(lat),
      Number(lng),
    );
  }
}