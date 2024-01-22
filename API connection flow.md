API connection flow

1. OAuth to retreive code
2. Get access token for further usage

3. Get spaces (for current team)
4. Get Lists 
4.1 Get Folders (save locally) -> Get Lists (by folder id) 
4.2 Get folderless list (only space id) //210978935 list id
5. Get Tasks for a List
5.1 Task name as table item name, put status, assignee, priority, created date and due date
5.2 on click expand row to show more info (description)
5.3 when clicked to a assignee (dropdown list of users from space)
5.4 when clicked on priority (dropdown list of priorities from space)
