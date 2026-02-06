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

export default function Settings() {
  return (
    <Page>
      <TitleBar title="Settings" />
      <Layout>
        <Layout.Section>
          <Card>
            <EmptyState
              heading="Configure your app settings"
              image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
            >
              <p>
                Manage your app preferences, API keys, default templates, and
                other configuration options.
              </p>
            </EmptyState>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
