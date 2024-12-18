const phoneRegexp = /^\+\d{9,14}$/;

// у номера телефона есть код
// страна
// сам номер
// для разных стран разные обработчики
// значит мне нужен сопоставитель страна-обработчик
// но не тут!
export class Phone {
  private id: string | null = null;
  private phone: string;
  private code: string | null = null;

  constructor(p: string) {
    this.phone = p;
  }

  checkIsPhoneValid(): boolean {
    return phoneRegexp.test(this.phone);
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
    return this.phone;
  }
}
