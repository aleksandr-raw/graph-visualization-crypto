import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {GraphData} from "../types/types";


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
        getMessages: build.mutation<GraphData, string>({
            query: (address) => ({
                url: `messages`,
                method: 'POST',
                body: {address},
            }),
        }),
    }),
});


export const {useGetMessagesMutation} = api;
