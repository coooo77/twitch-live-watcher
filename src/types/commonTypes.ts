/** number in string type ex: "22569633" */
export type StringTypeNumber = string

/** date in string type ex: "2022-07-14T03:31:40.070Z" */
export type DateStringType = string

export interface IPaginationType<T> {
  data: T
  pagination: { cursor?: string }
}

export interface DataType<T> {
  data: T
}

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]
