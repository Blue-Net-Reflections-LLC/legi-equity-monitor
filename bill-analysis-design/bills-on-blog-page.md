# Add bills to blog posts 

We need to add the bills that was used to generate the blog post hosted at @https://legiequity.us/blog/states-rethink-hiring-rise-skills-based-workforce-policy

- We should add the bills under the blog post as a collapsible section with header, "Show Related bills"
- The bills should be loaded SSR and collapsed by default
- The bills should render similar to the "Sponsored Bills" in the sponsor page using a in-page pagination in reverse chrological order.  see @https://legiequity.us/sponsor/5921/bryan-hughes 
- Each bill will contain the same elements displayed on the HP's Recent High-Impact Bills section
- Limit displaying 100 bills with the highest overall scores.
- If a blog post has no bills, do not show section.
- Schemas
  - E:\Development\bills-impact\bills-impact\bill-analysis-design\legi-scan-scheema.md
  - E:\Development\bills-impact\bills-impact\migrations\001_create_bill_analysis_tables.sql
  - E:\Development\bills-impact\bills-impact\migrations\003_add_cluster_analysis.sql
  - E:\Development\bills-impact\bills-impact\migrations\004_add_blog_post_images.sql

  - Ensure that the implementation is SEO friendly.

  