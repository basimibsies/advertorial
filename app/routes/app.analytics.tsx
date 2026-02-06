import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return json({});
};

export default function Analytics() {
  return (
    <Page>
      <TitleBar title="Analytics" />
      <Layout>
        <Layout.Section>
          <Card>
            <EmptyState
              heading="Track your advertorial performance"
              image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
            >
              <p>
                View detailed analytics and insights about how your advertorials
                are performing across different channels and campaigns.
              </p>
            </EmptyState>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
