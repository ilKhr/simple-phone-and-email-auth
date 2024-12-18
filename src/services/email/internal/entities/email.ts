const emailRegexp =
  /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;

export class Email {
  private id: string | null = null;
  private email: string;
  private code: string | null = null;

  constructor(email: string) {
    this.email = email;
  }

  checkIsEmailValid(): boolean {
    return emailRegexp.test(this.email);
  }

  setCode(c: string) {
    this.code = c;
  }

  getCode() {
    return this.code;
  }

  deleteCode() {
    this.code = null;
  }

  setId(id: string) {
    return (this.id = id);
  }

  getId() {
    return this.id;
  }

  get() {
    return this.email;
  }
}
