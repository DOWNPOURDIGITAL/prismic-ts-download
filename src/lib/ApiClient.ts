import Axios from 'axios';
import ApolloClient, { QueryOptions } from 'apollo-client';
import {
	InMemoryCache,
	IntrospectionFragmentMatcher,
	NormalizedCacheObject,
} from 'apollo-cache-inmemory';
import { PrismicLink } from 'apollo-link-prismic';

import FileManager from './FileManager';


export default class ApiClient extends FileManager {
	public apiPromise: Promise<ApolloClient<NormalizedCacheObject>>;


	constructor({ siteId, outDir }: {
		siteId: string;
		outDir: string;
	}) {
		super( outDir );

		// run introspection query first.
		// this is required to make Union types work
		// see https://github.com/prismicio/apollo-link-prismic/issues/10

		this.apiPromise = Axios({
			url: `https://${siteId}.cdn.prismic.io/api/v2`,
			method: 'GET',
		}).then( response => {
			const { ref } = response.data.refs.find( ( r: any ) => r.id === 'master' );
			return Axios({
				url: `https://${siteId}.prismic.io/graphql`,
				headers: {
					'prismic-ref': ref,
				},
				params: {
					query: `{
						__schema {
							types {
								kind
								name
								possibleTypes {
									name
								}
							}
						}
					}`,
				},
			});
		}).then( response => new ApolloClient({
			link: PrismicLink({
				uri: `https://${siteId}.prismic.io/graphql`,
			}),
			cache: new InMemoryCache({
				fragmentMatcher: new IntrospectionFragmentMatcher({
					introspectionQueryResultData: {
						__schema: {
							// eslint-disable-next-line no-underscore-dangle
							types: response.data.data.__schema.types.filter(
								( t: any ) => t.possibleTypes !== null,
							),
						},
					},
				}),
			}),
		}) );
	}


	public query( options: QueryOptions ): Promise<any> {
		return this.apiPromise.then( api => api.query( options ) );
	}
}
