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

export default function Integrations() {
  return (
    <Page>
      <TitleBar title="Integrations" />
      <Layout>
        <Layout.Section>
          <Card>
            <EmptyState
              heading="Connect your marketing tools"
              image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
            >
              <p>
                Integrate with Meta Ads, TikTok Ads, Google Ads, and other
                platforms to seamlessly publish and track your advertorials.
              </p>
            </EmptyState>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
