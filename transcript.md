`> create Ed pw` | > `create Jon pw`
`< Zepler Foyer` | < `Zepler Foyer`
< You find yourself in the Zepler building foyer. You immediately feel at home due to the lack of any natural light. Looking around, you can see a doorway to some stairs, a lift, a corridor, the entrance to a room marked 'Seminar Room 1', a reception desk, and, the exit to Mountbatten.` | < ``You find yourself in the Zepler building foyer. You immediately feel at home due to the lack of any natural light. Looking around, you can see a `doorway to some stairs, a lift, a corridor, the entrance to a room marked 'Seminar Room 1', a reception desk, and, the exit to Mountbatten.
`< Contents:` | < `Contents:`
`< Eric` | < `Eric`
`< Vending Machine` | < `Vending Machine`
`< chairs` | < `chairs`
`< Jon` | < `Ed`
`> @create TV Screen` | < `Ed has connected.`
`< Created.` | > `look`
`> @lock TV=TV` | < `Zepler Foyer`
`< Locked.` | < `You find yourself in the Zepler building foyer. You immediately feel at home due to the lack of any natural light. Looking around, `you can see a doorway to some stairs, a lift, a corridor, the entrance to a room marked 'Seminar Room 1', a reception desk, and, the exit to Mountbatten.
`> @failure TV=The TV is firmly attached to the wall.` | < `Contents:`
`< Failure message set.` | < `Eric`
`> @ofailure TV=tries to steal the TV, but it's firmly attached to the wall.` | < `Vending Machine`
`< Others failure message set.` | < `chairs`
`> drop TV` | < `Ed`
`< Dropped.` | < `TV Screen`
`< Jon tries to steal the TV, but it's firmly attached to the wall.` | > `take TV`
`< Jon presses the call button for the lift, waits momentarily for it to arrive, and then steps in once the doors have opened.` | < `The TV is `firmly attached to the wall.
`< Jon has left.` | > `lift`
`> stairs` | < `You press the call button for the lift, wait momentarily for it to arrive, and then step in once the doors have opened.`
`< Zepler North Stairwell` | < `Zepler Lift`
< You are stood in a stairwell. There are posters from student projects on the walls, and the floor is covered in a blue linoleum material that `squeaks as you walk. There are doors to Levels 1 though 4 and onto the roof.` | < `You are stood in a small lift. There are buttons to take you to `Levels 1 through 4.
`> 3` | > `3`
`< Zepler Level 3 North Corridor` | < `You press the button marked 3. You sense a slight motion of the floor, and after a short period a voice `announces 'Level Three' and the doors slide open. As soon as they've opened you step out of the lift.
< You are at the north end of a corridor that leads off the the south. You can see doors to the undergraduate computer science laboratory and the `stairwell, as well as a lift.` | < `Zepler Level 3 North Corridor`
`< Contents:` | < `You are at the north end of a corridor that leads off the the south. You can see doors to the undergraduate computer science `laboratory and the stairwell, as well as a lift.
`< Jon` | < `Ed has arrived.`
`< Jon is denied access to the lab.` | > `go ug lab`
`` | < `You can't go that way.`
`` | > `go lab`
`` | < `The card-lock on the door says 'Access Denied'.`
`` | > ``