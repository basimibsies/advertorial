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

export default function Experiments() {
  return (
    <Page>
      <TitleBar title="Experiments" />
      <Layout>
        <Layout.Section>
          <Card>
            <EmptyState
              heading="Run A/B tests on your advertorials"
              image="/illustrations/ab-test-empty-state.svg"
            >
              <p>
                Test different versions of your advertorials to see which ones
                perform best and optimize your conversion rates.
              </p>
            </EmptyState>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
