import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards } from "@nestjs/common";
import { CoursesService } from "./courses.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Public } from "../auth/public.decorator";

@Controller("courses")
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Public()
  @Get()
  async findAll(@Query("levelId") levelId?: string) {
    return this.coursesService.findAll(levelId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async findById(@Param("id") id: string, @Req() req: any) {
    return this.coursesService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post()
  async create(@Body() body: any) {
    return this.coursesService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Put(":id")
  async update(@Param("id") id: string, @Body() body: any) {
    return this.coursesService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.coursesService.remove(id);
  }
}
