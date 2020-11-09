## Background

We want to use a simple but effective group access system to templates, components, apps and categories/tags for app. This system uses just three types of users, regular user, admin and super admin. (The categories/tags are stored in the group record, so is of no concern here. Apps are automatically accessible to everyone in all groups a user belongs to, so again outside the scope of the discussion here.) 

Beyond the obvious use of groups to limit access to the types of items listed above, we also want to use the differences between admin and superadmin to facilitate the use of one Appyoumake installation for multiple types of users who should not see each other. For instance different companies that pay to use Appyoumake at a hosted facility could be set up with an admin each by the super admin; each admin would be assigned access to certain templates and components. 

"Cascading down" from this, the regular admin would then add groups and users. The admin would automatically be assigned membership to the groups they create to keep their admin level access.

## Implementation
* We use "FriendsOfSymfony" user bundle to deal with users, group memberships and authentication. 
* In the code we check for access in the following way:

|Item|Super admin|Admin|User|
|---|---|---|---|
|User<td rowspan='5'>All|All that belong to one or more groups that admin user belongs to|Can edit own password|
|Group|All that they belong to|N/A|
|App <td colspan='2'>Apps that were created by users that belong to one or more groups that current logged in user belongs to
|Template<td rowspan='2' colspan='2'>List all that are assigned to one or more of the groups they belong to
|Component|

## Implications at admin level
Users only see templates/components and apps linked to the group(s) they belong to and are therefore straight forward. Furthermore, they have no access to user, group, template or component database tools, so this is not an issue. The focus here is how to deal with UI and backend coding (particularly filtering) for admin and super admin users.

### Super admin
   * On the backend it means we need to create separate IF blocks for them when querying the database, never apply a filter (not even for enabled status) for this type of user.
   * When updating database (for instance app details such as name) they are ALWAYS allowed to update the record.
   * Can create new groups and users (superadmin, admin and regular).
   * Can assign and remove admin role to any user for any group (promote/demote).
   * Can upload templates and components, and assign group access for any group.
   * *When they create an app, access is only granted to users of groups they are specifically assigned to, hence they need to belong to at least one group.*
     * However, they are allowed to EDIT any existing app, regardless of group membership.
   * They can also delete any app, template, component, group and user.
     * Although data integrity issues apply, for instance a component used cannot be deleted, just disabled.

### (Regular) Admin: 
   * Group belonging is assigned by super admin OR when a new group is created by them (see below). 
   * On the backend we need to create IF blocks for admin+user when querying the database. We apply the same filter and checks as for regular users, namely that what they work on (view, edit, update) must be linked to one of the groups they belong to.
   * Can create new groups and users (admin and regular).
     * When add or edit group, they will ALWAYS be assigned as a member of the group (backend). If not group is "lost" to them.
     * Can assign and remove admin role to users that belong to the group(s) they control (promote/demote)
       * *Does not apply to their own record, they could end up locking themselves out*. If an admin user left a company, then a super admin would need to revoke their admin rights and assign the old groups to a new admin user.
   * Can upload templates and components, and assign group access for the groups they belong to. Can also disable them.
     * When add or edit users, templates or components they MUST select at least one group membership from list of groups they can administrate. If not user, template or component is "lost" to them.
   * Can create an app, editing access is granted to all users of all groups they are assigned to.
     * They are allowed to DELETE, DISABLE, EDIT or SEND TO MARKET any existing app created by any user from any of the groups they belong to. (Although data integrity issues apply, for instance an app sent to market cannot be deleted, just disabled.)

## Current state

Most of the above is implemented, it is primarily the display of admin / user access for super admins that need work. in addition the group membership checks on backend require checks and work.
