import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  EmptyState,
  ResourceList,
  ResourceItem,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const advertorials = await prisma.advertorial.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  const shopHost = `https://${shop}`;
  const advertorialsWithUrls = advertorials.map((a) => ({
    ...a,
    isRunning: !!a.shopifyPageUrl,
    livePageUrl: a.shopifyPageUrl
      ? a.shopifyPageUrl.startsWith("http")
        ? a.shopifyPageUrl
        : `${shopHost}${a.shopifyPageUrl.startsWith("/") ? "" : "/"}${a.shopifyPageUrl}`
      : null,
  }));

  return json({ advertorials: advertorialsWithUrls });
};

export default function Campaigns() {
  const { advertorials } = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="Campaigns">
        <Link to="/app/new">
          <Button variant="primary">Create Campaign</Button>
        </Link>
      </TitleBar>
      <Layout>
        <Layout.Section>
          {advertorials.length === 0 ? (
            <Card>
              <EmptyState
                heading="Create your first campaign"
                action={{
                  content: "Create Campaign",
                  url: "/app/new",
                }}
                image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
              >
                <p>
                  Generate high-converting advertorials (Story or Listicle style)
                  to run paid traffic on Meta, TikTok, and more.
                </p>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <ResourceList
                resourceName={{ singular: "campaign", plural: "campaigns" }}
                items={advertorials}
                renderItem={(item) => {
                  const { id, title, productTitle, template, angle, livePageUrl, isRunning, createdAt } = item;
                  return (
                    <ResourceItem
                      id={id}
                      url={`/app/${id}`}
                      accessibilityLabel={`View ${title}`}
                    >
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="200">
                          <Text variant="bodyMd" fontWeight="bold" as="h3">
                            {title}
                          </Text>
                          <InlineStack gap="200">
                            <Text variant="bodySm" tone="subdued" as="span">
                              Product: {productTitle}
                            </Text>
                            <Badge>{template}</Badge>
                            <Badge tone="info">{angle}</Badge>
                            {isRunning ? (
                              <Badge tone="success">Running</Badge>
                            ) : (
                              <Badge tone="attention">Draft</Badge>
                            )}
                          </InlineStack>
                          {livePageUrl && (
                            <Text variant="bodySm" as="p">
                              <a
                                href={livePageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {livePageUrl}
                              </a>
                            </Text>
                          )}
                          <Text variant="bodySm" tone="subdued" as="span">
                            Created {new Date(createdAt).toLocaleDateString()}
                          </Text>
                        </BlockStack>
                        {livePageUrl && (
                          <Button
                            url={livePageUrl}
                            target="_blank"
                            variant="plain"
                          >
                            View Page
                          </Button>
                        )}
                      </InlineStack>
                    </ResourceItem>
                  );
                }}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
