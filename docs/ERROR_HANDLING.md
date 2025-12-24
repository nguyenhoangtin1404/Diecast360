# Error Handling Standard

## Error Code List
- VALIDATION_ERROR
- USER_NOT_FOUND
- EMAIL_EXISTS
- UNAUTHORIZED
- FORBIDDEN
- INTERNAL_ERROR

---

## HTTP Mapping
| Code | Meaning |
|----|--------|
| 400 | Validation |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal |

---

## Response Format
```json
{
  "code": "EMAIL_EXISTS",
  "message": "Email already exists"
}
