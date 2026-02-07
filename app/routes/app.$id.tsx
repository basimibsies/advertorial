import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, useLoaderData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Banner,
  TextField,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const advertorial = await prisma.advertorial.findFirst({
    where: {
      id,
      shop: session.shop,
    },
  });

  if (!advertorial) {
    throw new Response("Not Found", { status: 404 });
  }

  // Ensure live page URL is absolute (fixes older records stored as /pages/...)
  const shopHost = `https://${session.shop}`;
  const livePageUrl = advertorial.shopifyPageUrl?.startsWith("http")
    ? advertorial.shopifyPageUrl
    : advertorial.shopifyPageUrl
      ? `${shopHost}${advertorial.shopifyPageUrl.startsWith("/") ? "" : "/"}${advertorial.shopifyPageUrl}`
      : null;

  return json({ advertorial: { ...advertorial, livePageUrl } });
};

export default function AdvertorialDetail() {
  const { advertorial } = useLoaderData<typeof loader>();
  const appBridge = useAppBridge();
  const [copied, setCopied] = useState(false);

  const liveUrl = (advertorial as { livePageUrl?: string | null }).livePageUrl ?? advertorial.shopifyPageUrl;

  const copyUrl = () => {
    if (liveUrl) {
      navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      appBridge.toast.show("URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Page>
      <TitleBar title={advertorial.title}>
        {liveUrl && (
          <Button
            url={liveUrl}
            target="_blank"
            variant="primary"
          >
            View Live Page
          </Button>
        )}
      </TitleBar>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingLg" as="h1">
                    {advertorial.title}
                  </Text>
                  <InlineStack gap="200">
                    <Badge>{advertorial.template}</Badge>
                    <Badge tone="info">{advertorial.angle}</Badge>
                  </InlineStack>
                </InlineStack>
                <Text variant="bodyMd" tone="subdued" as="p">
                  Product: {advertorial.productTitle}
                </Text>
                {liveUrl ? (
                  <Banner status="success" title="Published">
                    <p>
                      This advertorial has been published.{" "}
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View live page
                      </a>
                    </p>
                  </Banner>
                ) : (
                  <Banner status="warning" title="Not Published">
                    <p>This advertorial has not been published yet.</p>
                  </Banner>
                )}
              </BlockStack>
              <div
                style={{
                  border: "1px solid #e1e3e5",
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "#fff",
                }}
                dangerouslySetInnerHTML={{ __html: advertorial.content }}
              />
              {liveUrl && (
                <BlockStack gap="300">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    Live URL (copy to use in ads):
                  </Text>
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ flex: 1 }}>
                      <TextField
                        value={liveUrl}
                        readOnly
                        autoComplete="off"
                      />
                    </div>
                    <Button onClick={copyUrl} variant="secondary">
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </InlineStack>
                </BlockStack>
              )}
              <InlineStack gap="300">
                {liveUrl && (
                  <Button
                    url={liveUrl}
                    target="_blank"
                    variant="primary"
                  >
                    View Live Page
                  </Button>
                )}
                <Button url="/app" variant="plain">
                  Back to List
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">
                Details
              </Text>
              <BlockStack gap="200">
                <Text variant="bodySm" tone="subdued" as="span">
                  Created: {new Date(advertorial.createdAt).toLocaleString()}
                </Text>
                <Text variant="bodySm" tone="subdued" as="span">
                  Updated: {new Date(advertorial.updatedAt).toLocaleString()}
                </Text>
                {advertorial.shopifyPageId && (
                  <Text variant="bodySm" tone="subdued" as="span">
                    Shopify Page ID: {advertorial.shopifyPageId}
                  </Text>
                )}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

