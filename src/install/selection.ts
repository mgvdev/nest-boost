/** The user's explicit install-time choices that tailor guidelines and skills. */
export interface Selection {
  /** Architecture style id (standard, cqrs, hexagonal). */
  architecture?: string;
  /** Auth strategy id (none, passport, better-auth). */
  auth?: string;
  /** Test layout id (colocated, colocated-subfolder, central). */
  testLayout?: string;
}
