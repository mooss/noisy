export abstract class BaseSpec<T> {
    constructor(public params: T) { }
}

export interface BooleanSpecP {
    default: boolean;
}
export class BooleanSpec extends BaseSpec<BooleanSpecP> { }

export interface NumberSpecP {
    default: number;
}
export class NumberSpec extends BaseSpec<NumberSpecP> { }

export interface RangeSpecP extends NumberSpecP {
    min: number;
    max: number;
    step: number;
    formatter: (value: number) => number;
}
export class RangeSpec extends BaseSpec<RangeSpecP> { }

export interface SelectSpecP {
    default: string; // The default *key*.
    options: Record<string, any>;
}
export class SelectSpec extends BaseSpec<SelectSpecP> { }
