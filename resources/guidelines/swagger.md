## OpenAPI (@nestjs/swagger)

- Bootstrap the document with `SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config))`.
- Annotate DTOs with `@ApiProperty()` (and `@ApiPropertyOptional()`); enable the CLI plugin in `nest-cli.json` to infer most of these from types automatically.
- Document controllers with `@ApiTags`, `@ApiOperation`, and response shapes with `@ApiResponse`/`@ApiOkResponse`.
- Keep DTOs as the single source of truth for both validation and the OpenAPI schema — do not duplicate shapes.
