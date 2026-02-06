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

  return json({ advertorials });
};

export default function Index() {
  const { advertorials } = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="Advertorials">
        <Link to="/app/new">
          <Button variant="primary">Create Advertorial</Button>
        </Link>
      </TitleBar>
      <Layout>
        <Layout.Section>
          {advertorials.length === 0 ? (
            <Card>
              <EmptyState
                heading="Create your first advertorial"
                action={{
                  content: "Create Advertorial",
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
                resourceName={{ singular: "advertorial", plural: "advertorials" }}
                items={advertorials}
                renderItem={(item) => {
                  const { id, title, productTitle, template, angle, shopifyPageUrl, createdAt } = item;
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
                          </InlineStack>
                          {shopifyPageUrl && (
                            <Text variant="bodySm" as="p">
                              <a
                                href={shopifyPageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {shopifyPageUrl}
                              </a>
                            </Text>
                          )}
                          <Text variant="bodySm" tone="subdued" as="span">
                            Created {new Date(createdAt).toLocaleDateString()}
                          </Text>
                        </BlockStack>
                        {shopifyPageUrl && (
                          <Button
                            url={shopifyPageUrl}
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
