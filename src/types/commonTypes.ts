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
