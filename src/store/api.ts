import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {GraphData, TransformedGraphData} from "../types/types";


const API_HOST: string = process.env.BASE_URL || 'http://localhost:3000';

const baseQuery = fetchBaseQuery({
    baseUrl: `${API_HOST}/`,
    timeout: 10000,
});

export const api = createApi({
    reducerPath: 'baseApi',
    baseQuery,
    tagTypes: ['Messages'],
    endpoints: (build) => ({
        getMessages: build.mutation<TransformedGraphData, string>({
            query: (address) => ({
                url: `messages`,
                method: 'POST',
                body: {address},
            }),
            transformResponse: (response: GraphData) => {
                return {
                    ...response,
                    links: response.links.map((link) => {
                        return {
                            ...link,
                            source: link.sender,
                            target: link.receiver,
                        };
                    }),
                }
            }
        }),
    }),
});


export const {useGetMessagesMutation} = api;
