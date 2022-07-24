import api from '../util/axios'
import { DataType, IPaginationType, RequireOnlyOne } from '../types/commonTypes'

export interface FollowedStream {
  id: string
  user_id: string
  user_login: string
  user_name: string
  game_id: string
  game_name: string
  type: string
  title: string
  viewer_count: number
  started_at: string
  language: string
  thumbnail_url: string
  tag_ids: string[]
  is_mature: boolean
}

/** @see https://dev.twitch.tv/docs/api/reference#get-followed-streams */
export async function getFollowedStreams(params: {
  user_id: string
  after?: string
  first?: number
}): Promise<IPaginationType<FollowedStream[]>> {
  return api.get('https://api.twitch.tv/helix/streams/followed', {
    params
  })
}

export interface TwitchGetUsersParams {
  id?: string | string[]
  login?: string | string[]
}

export interface GetUsersResponse {
  id: string
  login: string
  display_name: string
  profile_image_url: string
  offline_image_url: string
}

/** @see https://dev.twitch.tv/docs/api/reference#get-users */
export async function getUsers(
  params: TwitchGetUsersParams = {}
): Promise<DataType<GetUsersResponse[]>> {
  return api.get('https://api.twitch.tv/helix/users', {
    params
  })
}

export interface IGetVideoRequired {
  id: string | string[]
  user_id: string
  game_id: string
}

export interface IGetVideoOptional {
  after?: string
  before?: string
  first?: string
  language?: string
  period?: string
  sort?: string
  type?: string
}

export type IGetVideosParams = RequireOnlyOne<
  IGetVideoRequired,
  keyof IGetVideoRequired
> &
  IGetVideoOptional

export interface IMutedSegments {
  duration: number
  offset: number
}

export interface IVod {
  id: string
  stream_id: string
  user_id: string
  user_login: string
  user_name: string
  title: string
  description: string
  created_at: string
  published_at: string
  url: string
  thumbnail_url: string
  viewable: 'public' | 'private'
  view_count: number
  language: string
  type: 'upload' | 'archive' | 'highlight'
  duration: string
  muted_segments: null | IMutedSegments
}

export type IGetVideosResult = IPaginationType<IVod[]>

/** @see https://dev.twitch.tv/docs/api/reference#get-videos */
export async function getVideos(
  params: IGetVideosParams
): Promise<IGetVideosResult> {
  return api.get('https://api.twitch.tv/helix/videos', {
    params
  })
}

export async function getFullVideos(params: IGetVideosParams) {
  const videos: IVod[] = []

  let hasPagination = ''

  do {
    const paginationParam = hasPagination ? { after: hasPagination } : {}

    const res = await getVideos({
      ...params,
      ...paginationParam
    })

    const { data, pagination } = res

    videos.push(...data)

    hasPagination = pagination.cursor || ''
  } while (hasPagination)

  return videos
}
