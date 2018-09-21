## Background

We want to use a simple but effective group access system to templates, components, apps and categories/tags for app. This system uses just three types of users, regular user, admin and super admin. (The categories/tags are stored in the group record, so is of no concern here. Apps are automatically accessible to everyone in all groups a user belongs to, so again outside the scope of the discussion here.) 

Beyond the obvious use of groups to limit access to the types of items listed above, we also want to use the differences between admin and superadmin to facilitate the use of one Mlab installation for multiple types of users who should not see each other. For instance different companies that pay to use Mlab at a hosted facility could be set up with an admin each by the super admin; each admin would be assigned access to certain templates and components. 

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
Users only see templates/components and apps linked to the group(s) they belong to and are therefore straight forward. The focus here is how to deal with UI and backend coding (particularly filtering) for admin and super admin users.

* Super Admin: 
   * Assign admin access to any user to any group. 
   * Create new groups and users (admin and regular).
   * Assign admin access to a regular user (elevate privilege). On the backend it means we need to create separate IF blocks for them when querying the database, never apply a filter (not even for enabled status) for this type of user.
* (Regular) Admin: Will see the following
  * Groups they have been assigned to by super admin PLUS any new groups they create.
  * Users who belong to groups they have been assigned to (i.e. users not created by them) and any new users they create.
  * Templates and components they have been given access to PLUS any new ones they have uploaded.
  * Apps made by any users in any groups they belong to.
* (Regular) User: 

### Super admin
* No filtering for listing required.
* When add user, MUST select at least one group membership.

Users must be assigned to at least ONE group that the
, they  and assign access to different templates and components 
