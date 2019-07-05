# BookMyTicket

## Routes
For all routes that have route protection, login and pass the Token in Bearer Type Authorization

### GET

**/api/shows** - Find all the shows that are available to be booked

**/api/shows/:time** - Find the seat layout for the particular show

**/api/shows/stats/:time** - Find the number of booked tickets and the total amount (Should be logged in)

### POST

**/api/signup** - Create a user 
**Sample Payload**

```

username:{Name}
email:{email}
password:{Password}
confirmPassword:{Password}

```

**/api/login** - Create a session for the particular user 
**Sample Payload**

```

email:{email}
password:{Password}

```

**/api/shows/register** - Register a new show
**Sample Payload**

```

time:{time in HHMI}
basePrice:{price}
seats:{arr:[R1:[0,1,0,1,1,1,0],R2:[1,1,0,1,1,1],R3:[1,0,1,0,1,0], R4:[1,1,1,1,1]]}
```

**/api/shows/book** - Book a movie ticket
**Sample Payload**

```

time:2300
seats:{arr:[R12#4,R1#3,R4#0]}

```


## Assumptions

- Partial Movie Booking is allowed
- Time duration between two shows is 3 hours
- Any user logged in can register a show
- Time will always be passed in HHMI (4 digits)
