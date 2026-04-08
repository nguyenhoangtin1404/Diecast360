export class PreOrderDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreOrderDomainException';
  }
}
