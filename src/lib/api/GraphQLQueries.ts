import * as fragments from './GraphQLQueries-fragments';
import { botQueries } from './GraphQLQueries-bot-queries';
import { dealQueries } from './GraphQLQueries-deal-queries';
import { userQueries } from './GraphQLQueries-user-queries';
import { exchangeQueries } from './GraphQLQueries-exchange-queries';
import { otherQueries } from './GraphQLQueries-other-queries';
import { variableQueries } from './GraphQLQueries-variables';

const GraphQlQuery = {
  ...fragments,
  ...botQueries,
  ...dealQueries,
  ...userQueries,
  ...exchangeQueries,
  ...otherQueries,
  ...variableQueries,
};

export default GraphQlQuery;
