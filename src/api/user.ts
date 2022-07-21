import api from '../util/axios'
import { DataType, IPaginationType } from '../types/commonTypes'

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
    headers: { 'Client-Id': import.meta.env.VITE_CLIENT_ID },
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
    headers: { 'Client-Id': import.meta.env.VITE_CLIENT_ID },
    params
  })
}


