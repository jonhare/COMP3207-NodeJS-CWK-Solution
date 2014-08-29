#A Brief guide to ECS-MUD

    ███████╗ ██████╗███████╗      ███╗   ███╗██╗   ██╗██████╗            
    ██╔════╝██╔════╝██╔════╝      ████╗ ████║██║   ██║██╔══██╗           
    █████╗  ██║     ███████╗█████╗██╔████╔██║██║   ██║██║  ██║           
    ██╔══╝  ██║     ╚════██║╚════╝██║╚██╔╝██║██║   ██║██║  ██║           
    ███████╗╚██████╗███████║      ██║ ╚═╝ ██║╚██████╔╝██████╔╝           
    ╚══════╝ ╚═════╝╚══════╝      ╚═╝     ╚═╝ ╚═════╝ ╚═════╝            

##Acknowlegements
This guide is largely based on ["A brief guide to TinyMUD"](http://www.mudbytes.net/download:68:764/tinymud.ps.Z) by Jennifer Stone and Rusty C. Wright. ECS-MUD is largely a clone of Jim Aspnes' TinyMUD version 1.4 from 1989, with a few features tweaked or removed.

##Ordinary commands

**drop &lt;*object*&gt;**  
**throw &lt;*object*&gt;**

Drops the specified object. &lt;*object*&gt; can be either a thing or exit. Can only be used on objects you are carrying. If the current room has the `temple` flag set, the object will return to its home; if the current room has a dropto set, the object will go the the dropto; otherwise, the item will be placed in the current room.

---------------------------------------

**examine &lt;*name*&gt;**

Prints a detailed description of object specified by &lt;*name*&gt; giving name, description, owner, key, failure message, success message, others failure message, others success message, and target. Can only be used on objects you own that are visible to you (in the same room or in your inventory).

---------------------------------------

**get &lt;*object*&gt;**  
**take &lt;*object*&gt;**

Gets the specified object. &lt;*object*&gt; can be either a thing or an *unlinked* exit in the same room as you.

---------------------------------------

**go &lt;*direction*&gt;**  
**go home**  
**goto &lt;*direction*&gt;**  
**goto home**  
**move &lt;*direction*&gt;**  
**move home**

Moves in the specified direction. **go home** is a special command that returns you to your home (initially *Limbo*). If the
direction is unambiguous, the go may be omitted.

---------------------------------------

**inventory**

Lists what you are carrying.

---------------------------------------

**look &lt;*object*&gt;**  
**read &lt;*object*&gt;**

&lt;*object*&gt; can be the name of the current room, or a thing, player, or direction within the current room or in your inventory. 
Prints a description of &lt;*object*&gt;. If the object name is omitted, then the current room is assumed.

---------------------------------------

**page &lt;*player*&gt;**

Used to inform an active player that you are looking for them. The
targeted player will get a message telling them your name and location.

---------------------------------------

**say &lt;*message*&gt;**

Display the &lt;*message*&gt; with the notification that you said it to other players in the same room. For example, if your player’s name is Betty the other players in the same room will see:

    Betty says "<message>"

---------------------------------------

**whisper &lt;*player*&gt;=&lt;*message*&gt;**

&lt;*player*&gt; is presented with &lt;*message*&gt; saying that you whispered it. The other
players only see the message

    Betty whispers something to <player>.

Occasionally (1 in 10 times), another player might overhear your whisper and see:

    You overheard Betty whisper "<message>" to <player>.


##Commands for modifying the dungeon

**@create &lt;*name*&gt;**

Creates a thing with the specified name. The thing will belong to you and be placed in your inventory. By default it will have it's home set to your home.

---------------------------------------

**@describe &lt;*object*&gt;=&lt;*description*&gt;**

&lt;*object*&gt; can be a room, thing, player, or direction that is in the same room as you, or in your inventory.

Sets the description a player sees when they use the command look &lt;*object*&gt;. If &lt;*object*&gt; is *here* it sets the description for the current room that is displayed when the room is entered. If &lt;*object*&gt; is me it sets the description for your character.

You can only set the description of an object you own.

---------------------------------------

**@dig &lt;*name*&gt;**

Creates a new room with the specified name, and prints the room’s
number.

---------------------------------------

**@failure &lt;*object*&gt; [ =&lt;*message*&gt; ]**  
**@fail &lt;*object*&gt; [ =&lt;*message*&gt; ]**

Without a message argument, clears the failure message on &lt;*object*&gt;, otherwise sets it. The failure message is printed to a player when they unsuccessfully attempt to *use* the object.

---------------------------------------

**@find &lt;*name*&gt;**

Prints the name and object number of every room, thing, or player that you control whose name (partially) matches &lt;*name*&gt;.

---------------------------------------

**@link &lt;*direction*&gt; = &lt;*room number*&gt;**  
**@link &lt;*thing*&gt; = &lt;*room number*&gt;**  
**@link &lt;*room*&gt; = &lt;*room number*&gt;**

In the first form links the exit of the current room specified by &lt;*direction*&gt; to the room specified by &lt;*room number*&gt;. The exit must be unlinked, and you must own the target room if its `link_ok` attribute is not set. If you don’t already own the exit its ownership is transferred to you. 

The second form sets the home for &lt;*thing*&gt;. If &lt;*thing*&gt; is *me* it sets your home. 

The third form sets the *dropto*; see [droptos](#dropto's) for an explanation of dropto’s.

---------------------------------------

**@lock &lt;*object*&gt;=&lt;*key*&gt;**

Sets a key (another object) for an object. Both the &lt;*object*&gt; and &lt;*key*&gt; must be in the current room or in your inventory. `here` and `me` are usable for both keys and objects.

In order to use &lt;*object*&gt; you must either be the key, or be carrying the key in your inventory, unless the `anti_lock` is set (see @set), in which case you must not be carrying the key or be the key.

---------------------------------------

**@name &lt;*object*&gt; = &lt;*name*&gt;**  

Changes the name of the specified object. This can also be used to specify a new direction list for an exit (see for example @open).

---------------------------------------

**@ofailure &lt;*object*&gt; [ =&lt;*message*&gt; ]**  
**@ofail &lt;*object*&gt; [ =&lt;*message*&gt; ]**

Without a message argument, clears the others failure message on &lt;*object*&gt;, otherwise sets it. The others failure message, prefixed by the player’s name, is shown to others when the player fails to use &lt;*object*&gt;.

---------------------------------------

**@open &lt;*direction*&gt; [ ; &lt;*other-dir*&gt; ]***

Creates an unlinked exit in the specified direction(s). Once created, you (or any other player) may use the @link command to specify the room to which the exit leads. See also @name.

---------------------------------------

**@osuccess &lt;*object*&gt; [ =&lt;*message*&gt; ]**

Without a message argument, clears the others success message on &lt;*object*&gt;, otherwise sets it. The others success message, prefixed by the player’s name, is shown to others when the player successfully uses &lt;*object*&gt;.

---------------------------------------

**@password &lt;*old*&gt;=&lt;*new*&gt;**

Sets a new password; you must specify your old password to verify your identity.

---------------------------------------

**@set &lt;*object*&gt;=&lt;*flag*&gt;**  
**@set &lt;*object*&gt;=!&lt;*flag*&gt;**

Sets (first form) or resets (second form) &lt;*flag*&gt; on &lt;*object*&gt;. The current flags are `anti_lock`, `link_ok`, and `temple`.

---------------------------------------

**@success &lt;*object*&gt;=&lt;*message*&gt;**

Without a message argument, clears the success message on &lt;*object*&gt;, otherwise sets it. The success message is printed when a player successfully uses &lt;*object*&gt;. Without &lt;*message*&gt; it clears the success message.

---------------------------------------

**@unlink &lt;*direction*&gt;**

Removes the link on the exit in the specified &lt;*direction*&gt;. You must own the exit. The exit may then be relinked by any player using the `@link` command and ownership of the exit transfers to that player.

---------------------------------------

**@unlock &lt;*object*&gt;**

Removes the lock on an object.


##ECS-MUD concepts

An *object* is either a player, room, thing, or exit.

In addition to the commands listed above there are some built in words in ECS-MUD; *me* and *here*. *me* refers to your character or player, and *here* refers to the room you are in. For example, you can use the `@describe` command to give yourself a description: `@describe me=You see a very wise computer scientist with a great knowledge of Javascript`.

###Success and the lack thereof

Locks on objects determine whether you can use that object. When you can take a thing or use an exit you are successful in using that object. The converse is true for failure. The `@success`, `@osuccess`, `@fail`, and `@ofail` commands set the success and failure messages on objects. 

###Object strings

Every object has six strings:

1.  Name. This is what you use with drop, examine, get, and so on.
2.  Description. This is what is given when you use the look command.
3.  Success message. This is what you see when you successfully use the object.
4.  Others success message. This is what the other players see when you successfully use the object.
5.  Failure message. This is what you see when you fail to use an object.
6.  Others failure message. This is what the other players see when you fail to use an object.

Success and failure messages are fairly straightforward. Just remember that for the messages set with `@osuccess` and `@ofail` the player’s name is prefixed onto the message when it is printed, while the messages set with `@success` and `@fail` are printed as-is.

###Object properties

As listed in the `@set` command, objects can have any of the following properties:

* **link\_ok**: You can link to a room if you control it, or if the room has its `link\_ok` flag set. Being able to link to a room means that you can set the homes of things (or yourself) to that room, and you can set the destination of exits to that room. See also the `@link` command for additional information on linking and section [sec:droptos] for droptos. Setting the `link\_ok` flag on players, things, and exits currently has no effect.

* **temple**: When a room has its temple flag set, anything that you drop in this room will immediately return to it's home location. Setting the `temple` flag on players, things, and exits currently has no effect.

* **anti\_lock**: When an object has the anti\_lock flag set together with a key object (see `@lock`), the meaning of the key is reverse (i.e. you must not be carrying the key (or be the key) to use the object).

###Control

There are three rules for determining control:

1.  You can control anything you own.
2.  A wizard can control anything.
3.  Anybody can control an unlinked exit (even if it is locked).

###Dropto’s

When the `@link` command is used on a room, it sets a dropto location for that room. Any thing dropped in the room (if it is not sticky; see above) will go to that location. If the room has its sticky flag set the effect of the dropto will be delayed until the last player leaves the room. The special location home may be used as a dropto, as in `@link here = home`; in that case things dropped in the room will go to their homes. To remove the dropto on a room go into that room and use `@unlink` here. Note that dropto's are not recursive, so a dropped item will only go directly to the dropto room, and not the dropto's dropto (and so on).

###Homes

Every thing or player has a home. For things, this is the location the thing returns to when sacrificed, when a player carrying it goes home,
or when (if its sticky flag is set) it is dropped. For players, this is where the player goes when they issue the home command. Homes may be set using the `@link` command; for example, `@link donut = &lt;*room-number*&gt;` or `@link me = &lt;*room-number*&gt;`. Exits may also be linked to the special location home; for example, `@link north = home` (note that the exit will always go to your home, not the home of the player using the exit).

###Recycling

Nothing can be destroyed in ECS-MUD, but it is possible to recycle just about anything. The `@name` command can be used to rename objects, making it easy to turn a silk purse into a sow’s ear or vice versa. Extra exits can be unlinked and picked up by their owner using the get command, and dropped like things using the drop command in any room controlled by the dropper.


##Examples {#sec:examples}

Here we present examples to demonstrate some of the features of TinyMUD.

###Making your home

The minimal steps for making your home are

1.  Make the room for your home with the `@dig` command. Write down the room number in case the following step takes a long time.
2.  Make or acquire an exit. In order to use the `@open` command you must own the room that you are doing the `@open` in. The alternative is to find a room with an exit that isn’t linked and use it.
3.  Make a link to your home. Once you’ve made or found an unlinked exit simply use the `@link` command to link the exit to your room.
4.  Find a room to which you can make a link in order to have an exit from your room (this is a room with the `link_ok` flag set). For the sake of example we’ll pretend the number of this room is 711. Without this you’d be able to go to your home but you wouldn’t have any way to get out of it.
5.  Set the link from you to your home. Go into your room and do:
    
        @link me = here

6.  Make the exit and link it to the destination:

        @open out
        @link out = 711

Of course there are probably various details that you would want to take care of in addition to the above steps. For example, if you’re antisocial and want to prevent other people from using your home room you’d do:

    @lock down = me

assuming that down is the exit you made in step 2. Along a similar vein you might not want other people linking to your room in which case you’d turn off the `link_ok` flag on
your room. You might also set the description of your home room. If you own the exit you could also set the success, others success, fail, and others fail messages on the exit to your home. Without the descriptions places and things are boring and uninteresting.

###Lock key boolean examples

When using the `@lock` command the key is another object. For example, if a room has a direction out and you want to prevent players from carrying the object xyz when they go out, you would use

    @lock out = xyz
    @set out=anti_lock

or if you want to prevent the player Julia from using the out exit you would use

    @lock out = Julia
    @set out=anti_lock

##Ersatz commands

You can make new commands by making an exit and then locking it to something impossible to have and then assigning the failure and others
failure messages to it. For example, assume the following commands have been used:

    @open eat
    @link eat = here
    @lock eat = here
    @fail eat = You try to eat but only gag
    @ofail eat = tries to eat but instead gags

Then when you use the command eat the others in the room will see "Betty tries to eat but instead gags" and you’ll see "You try to eat but only gag".

Note that this "new command" will only work in the room that you made it in.
