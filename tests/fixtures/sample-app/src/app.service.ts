import { Injectable, OnModuleInit } from "@nestjs/common";

// A side-effect flag so tests can assert that preview boot does NOT run
// lifecycle hooks. If onModuleInit ever fires during introspection, this
// mutates and the test fails.
export const lifecycleProbe = { moduleInitCalled: false };

@Injectable()
export class AppService implements OnModuleInit {
  onModuleInit() {
    lifecycleProbe.moduleInitCalled = true;
  }

  hello(): string {
    return "hello";
  }
}
